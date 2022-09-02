#!/usr/bin/env python3

import sys
import os
import time
import json


def read_stdin():
    while True:
        yield sys.stdin.readline()


gen = read_stdin()

try:
    for line in sys.stdin:
        print("debug:" + line, file=sys.stderr, flush=True)
        if line != "\t--MegSeparator--\t\n":
            print(line + "\t--MegSeparator--\t", flush=True)
            sys.stdout.flush()
except:
    print('exception stderr', file=sys.stderr)
