class ApiError extends Error {
  constructor(statusCode, message="something went wrong", error = [], statck="") {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.data=null;
    this.error = error;
    this.success= false;

    if(statck){
      this.stack=statck;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };