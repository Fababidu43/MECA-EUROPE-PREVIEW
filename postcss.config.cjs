module.exports = {
  plugins: [
    require('postcss-combine-duplicated-selectors')({
      removeDuplicatedProperties: true,
    }),
  ],
};
