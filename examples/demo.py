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
    for line in gen:
        if line != ("\t--MegSeparator--\t\n"):
            print(line + "\t--MegSeparator--\t", file=sys.stdout, flush=True)
            sys.stdout.flush()
except:
    print('exception stderr', file=sys.stderr)
    