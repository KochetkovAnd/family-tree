package com.kochetkov.familytree.dto.auth;

public record AuthResponse(
        String token,
        long expiresInSeconds,
        Long userId,
        String nickname,
        String displayName
) {
}
