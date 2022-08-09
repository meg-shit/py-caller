#!/usr/bin/env python3

import sys


def read_stdin():
    while True:
        yield sys.stdin.readline()


gen = read_stdin()

for line in gen:
    if line != "\r\t--MegSeparator--\r\t\n":
        print(line + "\r\t--MegSeparator--\r\t")
        print('attach stderr: ' + line, file=sys.stderr)
        sys.stdout.flush()
