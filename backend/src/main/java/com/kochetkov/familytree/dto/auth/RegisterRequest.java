package com.kochetkov.familytree.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank
        String nickname,

        @NotBlank
        @Size(min = 8, message = "Пароль должен быть не короче 8 символов")
        String password,

        @NotBlank
        String displayName
) {
}
