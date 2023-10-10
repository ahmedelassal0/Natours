module.exports = class {
  constructor(query, queryObj) {
    this.query = query;
    this.queryObj = queryObj;
  }

  // 1) Filtering
  filter() {
    // a) filtering
    const queryObj = { ...this.queryObj };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // b) advanced filtering
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gt|gte|lt|lte)\b/g,
      match => `$${match}`
    );
    this.query.find(JSON.parse(queryString));
    return this;
  }

  // 2) Sorting
  sort() {
    if (this.queryObj.sort) {
      const sort = this.queryObj.sort.split(',').join(' ');
      this.query = this.query.sort(sort);
    } else {
      this.query = this.query.sort('createdAt');
    }
    return this;
  }

  // 3) Field limitations
  fieldLimit() {
    if (this.queryObj.fields) {
      const fields = this.queryObj.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // 4) Pagination
  paginate() {
    const page = this.queryObj.page * 1 || 1;
    const limit = this.queryObj.limit * 1 || 5;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
};
