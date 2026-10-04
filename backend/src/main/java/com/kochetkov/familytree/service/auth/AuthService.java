package com.kochetkov.familytree.service.auth;

import com.kochetkov.familytree.dto.auth.AuthResponse;
import com.kochetkov.familytree.dto.auth.LoginRequest;
import com.kochetkov.familytree.dto.auth.RegisterRequest;
import com.kochetkov.familytree.entity.User;
import com.kochetkov.familytree.exception.ApiException;
import com.kochetkov.familytree.repository.UserRepository;
import com.kochetkov.familytree.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String nickname = request.nickname().trim();
        if (userRepository.existsByNickname(nickname)) {
            throw new ApiException(HttpStatus.CONFLICT, "NICKNAME_TAKEN", "Этот никнейм уже занят");
        }

        User user = new User();
        user.setNickname(nickname);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDisplayName(request.displayName().trim());
        userRepository.save(user);

        return toAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        String nickname = request.nickname().trim();
        User user = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Неверный никнейм или пароль"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Неверный никнейм или пароль");
        }

        return toAuthResponse(user);
    }

    private AuthResponse toAuthResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getNickname());
        return new AuthResponse(
                token,
                jwtService.getExpirationSeconds(),
                user.getId(),
                user.getNickname(),
                user.getDisplayName()
        );
    }
}
