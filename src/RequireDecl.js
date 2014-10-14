module.exports = {
	getModule: function(decl) {
		var val = decl.init.arguments[0].value;
		if (val.match(/\.js$/i)) {
			return val.substr(0, val.length - 3);
		}
		return val;
	},
};
