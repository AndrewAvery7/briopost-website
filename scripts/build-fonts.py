"""Rebuild the self-hosted web fonts in assets/ (needs: pip install fonttools brotli).

1. Download the variable fonts from the official google/fonts repository into a folder:
     https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf  -> inter-Inter[opsz,wght].ttf
     https://raw.githubusercontent.com/google/fonts/main/ofl/bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf
       -> bricolagegrotesque-BricolageGrotesque[opsz,wdth,wght].ttf
2. python scripts/build-fonts.py <download folder> assets

Output: assets/inter-var.woff2 (weights 400-800) and assets/bricolage-var.woff2 (weights 500-800), cut to Latin characters.
Licenses: SIL Open Font License 1.1 (assets/INTER-LICENSE.txt, assets/BRICOLAGE-LICENSE.txt).
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset
d=sys.argv[1]; out=sys.argv[2]
U="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2190-2193,U+2212,U+2215,U+2713,U+FEFF,U+FFFD"
jobs=[(d+'/inter-Inter[opsz,wght].ttf',{'wght':(400,800),'opsz':14},out+'/inter-var.woff2'),
      (d+'/bricolagegrotesque-BricolageGrotesque[opsz,wdth,wght].ttf',{'wght':(500,800),'wdth':100,'opsz':(12,96)},out+'/bricolage-var.woff2')]
for src,limits,dst in jobs:
    f=TTFont(src); f=instancer.instantiateVariableFont(f,limits); import io; b=io.BytesIO(); f.save(b); b.seek(0); f=TTFont(b)
    opts=subset.Options(); opts.flavor='woff2'; opts.layout_features=['*']; opts.name_IDs=['*']; opts.name_languages=['*']; opts.notdef_outline=True
    s=subset.Subsetter(opts); s.populate(unicodes=subset.parse_unicodes(U)); s.subset(f)
    f.flavor='woff2'; f.save(dst); import os; print(dst, os.path.getsize(dst))
