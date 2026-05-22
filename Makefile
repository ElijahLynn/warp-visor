UUID := warp-visor@local
EXTENSION_DIR := $(CURDIR)/$(UUID)
INSTALL_DIR := $(HOME)/.local/share/gnome-shell/extensions/$(UUID)

.PHONY: all test schemas install install-dev-cmd package clean

all: test

schemas:
	glib-compile-schemas $(EXTENSION_DIR)/schemas

test: schemas
	gjs -m tests/geometry.test.js

install: schemas
	mkdir -p $(INSTALL_DIR)
	cp -r $(EXTENSION_DIR)/* $(INSTALL_DIR)/

install-dev-cmd:
	chmod +x $(CURDIR)/scripts/warp-visor-dev
	mkdir -p $(HOME)/.local/bin
	ln -sf $(CURDIR)/scripts/warp-visor-dev $(HOME)/.local/bin/warp-visor-dev
	rm -f $(HOME)/.local/bin/warp-visor-test

package: schemas
	gnome-extensions pack -f -o $(CURDIR) \
		--schema=$(EXTENSION_DIR)/schemas/org.gnome.shell.extensions.warp-visor.gschema.xml \
		--extra-source=$(EXTENSION_DIR)/geometry.js \
		$(EXTENSION_DIR)

clean:
	rm -f $(UUID).zip
	rm -f $(EXTENSION_DIR)/schemas/gschemas.compiled
