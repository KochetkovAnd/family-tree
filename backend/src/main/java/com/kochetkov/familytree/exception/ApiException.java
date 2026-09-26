package com.kochetkov.familytree.exception;

import org.springframework.http.HttpStatus;

// Mirrors the error shape from docs/api.md: { "error": "<code>", "message": "<text>" }
public class ApiException extends RuntimeException {

    private final String errorCode;
    private final HttpStatus status;

    public ApiException(HttpStatus status, String errorCode, String message) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
