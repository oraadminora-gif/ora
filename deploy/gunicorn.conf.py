# Gunicorn configuration — ORA Backend
# Chemin sur le VPS : /var/www/ora/gunicorn.conf.py

bind = "unix:/run/ora/gunicorn.sock"
workers = 3                  # (2 × CPU) + 1 — adapter si > 1 CPU
worker_class = "sync"
timeout = 120
keepalive = 5
max_requests = 1000
max_requests_jitter = 100
loglevel = "warning"
accesslog = "/var/log/ora/gunicorn_access.log"
errorlog  = "/var/log/ora/gunicorn_error.log"
