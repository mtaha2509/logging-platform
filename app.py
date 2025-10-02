import time
import logging

logging.basicConfig(filename='/tmp/app-logs/app3.log',
                    level=logging.INFO,
                    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}')

while True:
    logging.debug("This is an info log from app3")
    logging.warning("This is an warn log from app3")
    time.sleep(3)
