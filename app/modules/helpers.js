
// object helpers
Object.defineProperty(
    Object.prototype, 
    "isFunction",
    {
        writable : false,
        enumerable : false, 
        configurable : false,
        value : function () {
            return {}.toString.call(this) === "[object Function]";
        }
    }
);
