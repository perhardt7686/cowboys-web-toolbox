/* Family Calendar uses the EXISTING, cleared Google Calendar named 'Family'.
 * Google Calendar ID is deliberately NOT exposed on this public static page.
 * Events reach approved Commons members only through an authenticated RPC.
 * Source calendar stays private at Google; no public calendar embed or ACL change.
 */
window.COWBOY_FAMILY_CALENDAR=Object.freeze({
  name:'The Family Calendar',
  timezone:'America/New_York',
  visibility:'approved-members-only',
  source:'existing-google-family-calendar',
  access:'read-only calendar board'
});
