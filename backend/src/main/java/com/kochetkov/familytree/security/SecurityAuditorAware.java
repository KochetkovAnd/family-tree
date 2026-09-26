package com.kochetkov.familytree.security;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

// Backs @CreatedBy/@LastModifiedBy on AuditEntity. Falls back to "system" for
// writes with no authenticated user in context — e.g. self-registration,
// where the row being created (the User) IS the not-yet-authenticated actor.
@Component("auditorAware")
public class SecurityAuditorAware implements AuditorAware<String> {

    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof AppUserPrincipal principal) {
            return Optional.of(principal.getUsername());
        }
        return Optional.of("system");
    }
}
