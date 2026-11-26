FROM python:3.11-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=10000
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl build-essential libxml2-dev libxslt1-dev libffi-dev libssl-dev \
    && curl --fail --location --retry 3 https://github.com/smicallef/spiderfoot/archive/0f815a203afebf05c98b605dba5cf0475a0ee5fd.tar.gz -o /tmp/spiderfoot.tar.gz \
    && mkdir -p /opt/spiderfoot \
    && tar -xzf /tmp/spiderfoot.tar.gz --strip-components=1 -C /opt/spiderfoot \
    && curl --fail --location --retry 3 https://raw.githubusercontent.com/publicsuffix/list/88b076a1fb2ae58cd2a6959d570f075e04d21867/public_suffix_list.dat -o /opt/spiderfoot/public_suffix_list.dat \
    && pip install --no-cache-dir -r /opt/spiderfoot/requirements.txt \
    && rm -f /tmp/spiderfoot.tar.gz \
    && apt-get purge -y --auto-remove curl build-essential libxml2-dev libxslt1-dev libffi-dev libssl-dev \
    && rm -rf /var/lib/apt/lists/*
RUN useradd --uid 10001 --create-home --shell /usr/sbin/nologin core
WORKDIR /app
COPY app.py runner.py accounts-sites.json ./
COPY tests ./tests
USER 10001:10001
EXPOSE 10000
CMD ["python", "app.py"]
