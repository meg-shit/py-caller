#!/usr/bin/env python3

import sys


def read_stdin():
    while True:
        yield sys.stdin.readline()


gen = read_stdin()

for line in gen:
    print(line, flush=True, end='')
