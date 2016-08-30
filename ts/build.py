#!/usr/bin/env python

import os
import sys
import shutil

os.system("tsc")
os.system('tsc -d --outDir tmp OOSMOS.ts')

if os.path.exists('typings/OOSMOS.d.ts'):
  os.remove('typings/OOSMOS.d.ts')

shutil.move('tmp/OOSMOS.d.ts', 'typings/OOSMOS.d.ts')
shutil.rmtree('tmp')

os.system("webpack")
