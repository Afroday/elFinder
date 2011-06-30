"use strict"
/**
 * @class  elFinder command "rm"
 * Delete files
 *
 * @author Dmitry (dio) Levashov
 **/
elFinder.prototype.commands.rm = function() {
	
	this.shortcuts = [{
		pattern     : 'delete ctrl+backspace'
	}];
	
	this.getstate = function(sel) {
		var fm = this.fm;
		sel = sel || fm.selected();
		return sel.length && $.map(sel, function(h) { var f = fm.file(h); return f.phash && !f.locked ? h : null }).length == sel.length
			? 0 : -1;
	}
	
	this.exec = function(hashes) {
		var self   = this,
			fm     = this.fm,
			errors = fm.errors(),
			dfrd   = $.Deferred()
				.fail(function(error) {
					error && fm.error(error);
				}),
			files  = this.files(hashes),
			cnt    = files.length,
			cwd    = fm.cwd().hash,
			goroot = false;
		
		if (!cnt) {
			return dfrd.reject();
		}
		
		$.each(files, function(i, file) {
			if (!file.phash) {
				return !dfrd.reject([errors.rm, file.name, errors.denied]);
			}
			if (file.locked) {
				return !dfrd.reject([fm.errors.locked, file.name]);
			}
			if (file.hash == cwd) {
				goroot = fm.root(file.hash);
			}
		});

		if (!dfrd.isRejected()) {
			files = this.hashes(hashes);
			
			fm.confirm({
				title  : self.title,
				text   : fm.res('confirm', 'rm'),
				accept : {
					label    : self.title,
					callback : function() {  
						fm.lockfiles({files : files});
						fm.ajax({
							data   : {cmd  : 'rm', targets : files, current : fm.cwd().hash}, // current - for old api
							notify : {type : 'rm', cnt : cnt},
							preventFail : true
						})
						.fail(function(error) {
							dfrd.reject(error);
						})
						.done(function(data) {
							dfrd.done(data);
							goroot && fm.exec('open', goroot)
						}
						).always(function() {
							fm.unlockfiles({files : files});
						});
					}
				},
				cancel : {
					label    : 'cancel',
					callback : function() { dfrd.reject(); }
				}
			});
		}
			
		return dfrd;
	}

}