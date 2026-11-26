"""Isolated CLI adapter for the pinned upstream engine; never starts sf.py -l."""
import argparse
from copy import deepcopy
import importlib
import json
import multiprocessing as mp
import os
from pathlib import Path
import runpy
import sys

BASE = Path(__file__).resolve().parent
SF = Path("/opt/spiderfoot")

def install_adapter():
    sys.path.insert(0, str(SF))
    import modules.sfp_accounts as accounts
    manifest = json.loads((BASE / "accounts-sites.json").read_text("utf-8"))
    sites = manifest["sites"]
    if not 1 <= len(sites) <= 12:
        raise RuntimeError("Invalid bounded site manifest")
    keys = {(site["name"], site["uri_check"]) for site in sites}
    original_setup = accounts.sfp_accounts.setup

    def bounded_setup(self, sfc, userOpts=None):
        self.opts = deepcopy(type(self).opts)
        options = {**(userOpts or {}), "permutate": False, "musthavename": True,
                   "_fetchtimeout": 4, "_maxthreads": 1}
        sfc.cachePut("sfaccountsv2", json.dumps({"sites": sites}))
        original_setup(self, sfc, options)
        if self.errorState:
            return
        self.sites = [s for s in self.sites if (s["name"], s["uri_check"]) in keys][:12]
        if (self.opts.get("_maxthreads") != 1 or self.opts.get("_fetchtimeout") != 4
                or self.opts.get("permutate") is not False or not 1 <= len(self.sites) <= 12):
            raise RuntimeError("Account limits were not applied")

    accounts.sfp_accounts.setup = bounded_setup
    return accounts, bounded_setup

def configure(work):
    for key, leaf in (("SPIDERFOOT_DATA", "data"), ("SPIDERFOOT_CACHE", "cache"), ("SPIDERFOOT_LOGS", "logs")):
        path = work / leaf
        path.mkdir(parents=True, exist_ok=True)
        os.environ[key] = str(path)
    if mp.get_start_method(allow_none=True) not in (None, "fork"):
        raise RuntimeError("The pinned adapter requires fork")
    if mp.get_start_method(allow_none=True) is None:
        mp.set_start_method("fork")
    os.chdir(SF)

def self_test():
    import tempfile
    with tempfile.TemporaryDirectory() as directory:
        configure(Path(directory))
        module, bounded_setup = install_adapter()
        from spiderfoot import SpiderFootHelpers
        discovered = SpiderFootHelpers.loadModulesAsDict(str(SF / "modules"))["sfp_accounts"]["object"]
        assert type(discovered) is module.sfp_accounts
        assert discovered.setup.__func__ is bounded_setup
        assert importlib.import_module("modules.sfp_accounts") is module
        class FakeSF:
            def __init__(self):
                self.cache = {}
            def cachePut(self, label, data):
                self.cache[label] = data
            def cacheGet(self, label, _):
                return self.cache.get(label)
        instance = module.sfp_accounts()
        instance.setup(FakeSF(), {"_maxthreads": 200, "permutate": True, "_fetchtimeout": 100})
        assert len(instance.sites) == 12 and instance.opts["_maxthreads"] == 1
        assert instance.opts["permutate"] is False and instance.opts["_fetchtimeout"] == 4
        print("Pinned upstream module discovery and scope limits verified.")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--work", type=Path)
    parser.add_argument("--kind", choices=("name", "username", "email"))
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    if not args.work or not args.kind:
        parser.error("--work and --kind are required")
    from app import engine_target
    query = sys.stdin.read(512)
    target = engine_target(args.kind, query)
    configure(args.work)
    install_adapter()
    from spiderfoot import SpiderFootDb
    db = SpiderFootDb({"__database": str(args.work / "data" / "spiderfoot.db")})
    db.configSet({"_fetchtimeout": "4", "_maxthreads": "1", "sfp_accounts:permutate": "0"})
    db.conn.close()
    sys.argv = [str(SF / "sf.py"), "-s", target, "-m", "sfp_accounts",
                "-o", "json", "-q", "-max-threads", "1"]
    runpy.run_path(str(SF / "sf.py"), run_name="__main__")

if __name__ == "__main__":
    main()
