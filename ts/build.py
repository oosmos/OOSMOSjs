#!/usr/bin/env python

import os
import shutil

os.system("tsc")
os.system('tsc -d --outDir tmp OOSMOS.ts')

if os.path.exists('OOSMOS.d.ts'):
  os.remove('OOSMOS.d.ts')

shutil.move('tmp/OOSMOS.d.ts', 'OOSMOS.d.ts')
shutil.rmtree('tmp')

os.system("webpack")
