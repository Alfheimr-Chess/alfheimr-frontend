.PHONY: clean

TS_SRC_FILES = $(wildcard *.ts)
JS_FILES = $(TS_SRC_FILES:.ts=.js)

all: $(JS_FILES)

%.js: %.ts
	tsc $< --target es6

clean:
	rm *.js
