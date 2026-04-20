package com.swifteats.swifteats.service;

import com.swifteats.swifteats.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class PasswordResetNotificationService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@swifteats.local}")
    private String fromAddress;

    public PasswordResetNotificationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(User user, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setFrom(fromAddress);
        message.setSubject("SwiftEats password reset");
        message.setText("""
                Hello %s,

                We received a request to reset your SwiftEats password.

                Use the link below to set a new password:
                %s

                If you did not request this, you can ignore this email.
                """.formatted(user.getFullName(), resetLink));

        try {
            mailSender.send(message);
            log.info("Password reset email sent to {}", user.getEmail());
        } catch (Exception ex) {
            log.warn("Failed to send password reset email to {}. Reset link: {}", user.getEmail(), resetLink, ex);
        }
    }
}
