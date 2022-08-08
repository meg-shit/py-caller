import sys
import json


class Caller(object):
    _instance = None

    def __init__(self):
        ...

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super().__new__(cls)
        return cls._instance

    def write(self, data):
        if isinstance(data, str):
            print(data + "\n\r\t--MegSeparator--\r\t\n", flush=True, end="")
        else:
            print(
                json.dumps(data, ensure_ascii=True) +
                "\n\r\t--MegSeparator--\r\t",
                flush=True,
            )
            sys.stdout.flush()

    def read(self):
        while True:
            line = sys.stdin.readline()
            if line != "\r\t--MegSeparator--\r\t\n":
                yield json.loads(line)


if __name__ == "__main__":
    c = Caller()

    for i in range(5):
        c.write({"task_id": 123, "state": "success"})
