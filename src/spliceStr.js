module.exports = function spliceSlice(str, index, count, add) {
	if (add === undefined) {
		add = '';
	}
  return str.slice(0, index) + add + str.slice(index + count);
};
