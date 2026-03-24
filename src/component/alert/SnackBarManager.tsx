class SnackBarManager {
    _defaultSnackBar: any = null;
    register(_ref: any) {
      this._defaultSnackBar = _ref;
    }
    unregister(_ref: any) {
      if (
        !!this._defaultSnackBar &&
        this._defaultSnackBar._id &&
        this._defaultSnackBar._id === _ref._id
      ) {
        this._defaultSnackBar = null;
      }
    }
    getDefault() {
      return this._defaultSnackBar;
    }
  }
  export default new SnackBarManager();  