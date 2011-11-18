all:
	palm-package --use-v1-format .

install: all
	palm-install *.ipk

clean:
	rm *.ipk 2>/dev/null || true

appid:
	grep '"id"' appinfo.json | cut -d: -f2 | cut -d'"' -f2 > .appid

launch: install appid
	palm-launch -i `cat .appid`

log: appid
	-palm-log -f `cat .appid` | sed -u									\
		-e 's/\[[0-9]*-[0-9]*:[0-9]*:[0-9]*\.[0-9]*\] [a-zA-Z]*: //'	\
		-e 's/indicated new content, but not active./\n\n\n/'

test: launch log
	true

.PHONY: clean

