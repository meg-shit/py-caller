#!/usr/bin/env python3

import sys


def read_stdin():
    while True:
        yield sys.stdin.readline()


gen = read_stdin()

s = bytearray(str('helloworld' * 1024 * 1024), 'utf-8')
bf = memoryview(s)

for line in gen:
    if line != "\r\t--MegSeparator--\r\t\n":
        print(str(bf, 'utf8') + "\r\t--MegSeparator--\r\t\n", end='')
        sys.stdout.flush()
