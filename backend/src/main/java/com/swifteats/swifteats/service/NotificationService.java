package com.swifteats.swifteats.service;

import com.swifteats.swifteats.dto.common.PaginatedResponse;
import com.swifteats.swifteats.dto.notification.NotificationDTO;
import com.swifteats.swifteats.exception.ResourceNotFoundException;
import com.swifteats.swifteats.model.Notification;
import com.swifteats.swifteats.model.NotificationType;
import com.swifteats.swifteats.model.User;
import com.swifteats.swifteats.repository.NotificationRepository;
import com.swifteats.swifteats.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public NotificationDTO createNotification(User user, NotificationType type, String title, String message,
                                              String referenceType, String referenceId) {
        Notification notification = notificationRepository.save(Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .build());
        return NotificationDTO.fromEntity(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getUnreadForUser(User user) {
        return notificationRepository.findTop10ByUserIdAndReadFalseOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(NotificationDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getUnreadForCurrentUser() {
        return getUnreadForUser(currentUser());
    }

    @Transactional(readOnly = true)
    public UnreadNotificationSnapshot getUnreadSnapshotForUser(User user) {
        List<NotificationDTO> unreadItems = notificationRepository.findTop10ByUserIdAndReadFalseOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(NotificationDTO::fromEntity)
                .toList();
        long unreadCount = notificationRepository.countByUserIdAndReadFalse(user.getId());
        return new UnreadNotificationSnapshot(unreadCount, unreadItems);
    }

    @Transactional(readOnly = true)
    public UnreadNotificationSnapshot getUnreadSnapshotForCurrentUser() {
        return getUnreadSnapshotForUser(currentUser());
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<NotificationDTO> getMyNotifications(Pageable pageable) {
        User user = currentUser();
        return PaginatedResponse.fromPage(notificationRepository.findByUserId(user.getId(), pageable)
                .map(NotificationDTO::fromEntity));
    }

    @Transactional
    public NotificationDTO markAsRead(Long id) {
        User user = currentUser();
        Notification notification = notificationRepository.findById(id)
                .filter(value -> value.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setRead(true);
        return NotificationDTO.fromEntity(notificationRepository.save(notification));
    }

    @Transactional(readOnly = true)
    public long unreadCountForCurrentUser() {
        return notificationRepository.countByUserIdAndReadFalse(currentUser().getId());
    }

    public record UnreadNotificationSnapshot(long count, List<NotificationDTO> items) {
    }

    private User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new ResourceNotFoundException("No authenticated user found");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
