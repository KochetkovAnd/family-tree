package com.kochetkov.familytree.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

// Without this, Spring Security's default for "no/invalid token" is a bare
// 403 with no body — this instead matches the { "error", "message" } shape
// every other endpoint uses (see docs/api.md), and correctly returns 401
// (not authenticated) rather than 403 (authenticated but not permitted).
// Written by hand rather than via an injected ObjectMapper — this stays a
// fixed two-field literal, not worth pulling Jackson into a security class.
@Component
public class JsonAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"error\":\"UNAUTHENTICATED\",\"message\":\"Требуется авторизация\"}");
    }
}
