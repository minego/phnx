all:
	@palm-package --use-v1-format --exclude=originals .

patrick: 
	@palm-package --use-v1-format .
	@palm-install *.ipk
	@rm *.ipk
	@palm-launch net.minego.phnx
	@palm-log -f net.minego.phnx

initrepo:
	@git remote add upstream git://github.com/minego/phnx.git

update:
	@git fetch upstream
	@git merge upstream/master

install: all
	@palm-install *.ipk

clean:
	@rm *.ipk .appid .filename 2>/dev/null || true

appid:
	@grep '"id"' appinfo.json | cut -d: -f2 | cut -d'"' -f2 > .appid

launch: install appid
	@palm-launch -i `cat .appid`

log: appid
	-palm-log -f `cat .appid` | sed -u									\
		-e 's/\[[0-9]*-[0-9]*:[0-9]*:[0-9]*\.[0-9]*\] [a-zA-Z]*: //'	\
		-e 's/indicated new content, but not active./\n\n\n/'

test: launch log
	@true

version:
	@cat appinfo.json| grep version | sed 's/.*:.*"\(.*\)".*/\1/' > .version

filename: version all appid
	@echo "`cat .appid`_`cat .version`_all.ipk" > .filename

# Build a Packages file to use in the preware feed
Packages: filename
	@echo "Creating Packages file for preware feed"
	@echo "Package: "`cat .appid`									>  Packages
	@echo "Version: "`cat .version`									>> Packages
	@echo "Section: Social Networks"								>> Packages
	@echo "Description: Project Macaw"								>> Packages
	@echo "Architecture: all"										>> Packages
	@echo "Maintainer: "													\
			"Micah N Gorrell <macaw@minego.net>, "							\
			"Owen Swerkstrom, "												\
			"Patrick Campanale, "											\
			"Dave Cole, "													\
			"Donald Kirker"											>> Packages
	@echo "Filename: `cat .filename`"								>> Packages
	@echo "Size: `cat \`cat .filename\` | wc -c`"					>> Packages
	@echo "MD5Sum: `cat \`cat .filename\` | md5sum | sed 's/ *-//'`">> Packages
	@echo 	"Source: { "													\
			"\"Feed\":\"minego\", "											\
			"\"Title\":\"Project Macaw\", "									\
			"\"HomePage\":\"http://www.github.com/minego/phnx\", "			\
			"\"Icon\":\"http://minego.net/phnx/macaw/icon.png\", "			\
			"\"Type\":\"Application\", "									\
			"\"Category\":\"Social Networks\", "							\
			"\"License\":\"Open; see homepage\", "							\
			"\"LastUpdated\":\"`date -u +%s`\", "							\
			"\"MinWebOSVersion\":\"1.4.5\", "								\
			"\"Screenshots\":["												\
			"	\"http://minego.net/phnx/macaw/screenshot1.png\","			\
			"	\"http://minego.net/phnx/macaw/screenshot2.png\""			\
			"], "															\
			"\"FullDescription\":\""										\
				"Project Macaw is an attempt to update the wonderful phnx "	\
				"twitter client for the TouchPad, and to add additional "	\
				"features that will make it more useful for those who use "	\
				"it on multiple devices, such as tweet marker and sharing "	\
				"options.<br />"											\
				"The goal is to be merged back into phnx when complete."	\
				"<br/><br/>"												\
				"Recent Changes:<br/>"										\
				"<ul>"														\
				" <li>Added a changelog</li>"								\
				" <li>Disable the post button while posting a tweet</li>"	\
				" <li>Added an automatic mode for the card icons</li>"		\
				" <li>Added basic support for filters</li>"					\
				" <li>Show sent DMs</li>"									\
				"</ul>"														\
				"\""														\
			"}"														>> Packages
	@echo ""														>> Packages
	@rm -rf Packages.gz 2>/dev/null || true
	@gzip -c Packages > Packages.gz

Packages.gz: Packages


.PHONY: clean

