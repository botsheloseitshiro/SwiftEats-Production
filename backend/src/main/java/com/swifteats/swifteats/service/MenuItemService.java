package com.swifteats.swifteats.service;

import com.swifteats.swifteats.dto.MenuItemDTO;
import com.swifteats.swifteats.dto.common.PaginatedResponse;
import com.swifteats.swifteats.exception.ResourceNotFoundException;
import com.swifteats.swifteats.model.MenuItem;
import com.swifteats.swifteats.model.Restaurant;
import com.swifteats.swifteats.model.Role;
import com.swifteats.swifteats.model.User;
import com.swifteats.swifteats.repository.MenuItemRepository;
import com.swifteats.swifteats.repository.RestaurantRepository;
import com.swifteats.swifteats.repository.ReviewRepository;
import com.swifteats.swifteats.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<MenuItemDTO> getMenuByRestaurant(Long restaurantId) {
        if (!restaurantRepository.existsById(restaurantId)) {
            throw new ResourceNotFoundException("Restaurant not found with id: " + restaurantId);
        }
        return menuItemRepository.findByRestaurantIdAndArchivedFalseAndAvailableTrue(restaurantId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<MenuItemDTO> getAllMenuItemsForAdmin(Long restaurantId, String search, Pageable pageable) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));
        validateRestaurantAccess(restaurant);

        List<MenuItemDTO> filtered = menuItemRepository.findByRestaurantId(restaurantId).stream()
                .filter(item -> search == null || search.isBlank()
                        || item.getName().toLowerCase(Locale.ROOT).contains(search.trim().toLowerCase(Locale.ROOT))
                        || (item.getCategory() != null && item.getCategory().toLowerCase(Locale.ROOT).contains(search.trim().toLowerCase(Locale.ROOT))))
                .map(this::toDto)
                .toList();

        List<MenuItemDTO> sorted = applySort(filtered, pageable.getSort());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), sorted.size());
        List<MenuItemDTO> content = start >= sorted.size() ? List.of() : sorted.subList(start, end);
        Page<MenuItemDTO> page = new PageImpl<>(content, pageable, sorted.size());
        return PaginatedResponse.fromPage(page);
    }

    @Transactional(readOnly = true)
    public MenuItemDTO getMenuItemById(Long id) {
        MenuItem item = menuItemRepository.findByIdAndArchivedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + id));
        return toDto(item);
    }

    @Transactional
    public MenuItemDTO createMenuItem(MenuItemDTO dto) {
        Restaurant restaurant = restaurantRepository.findById(dto.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + dto.getRestaurantId()));
        validateRestaurantAccess(restaurant);

        MenuItem item = MenuItem.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .category(dto.getCategory())
                .imageUrl(dto.getImageUrl())
                .available(dto.isAvailable())
                .archived(false)
                .discountPercentage(normalizeDiscount(dto.getDiscountPercentage()))
                .restaurant(restaurant)
                .build();

        MenuItem saved = menuItemRepository.save(item);
        auditLogService.log("MENU_ITEM_CREATED", authActor(), "MenuItem", String.valueOf(saved.getId()),
                Map.of("restaurantId", restaurant.getId(), "name", saved.getName()));
        return toDto(saved);
    }

    @Transactional
    public MenuItemDTO updateMenuItem(Long id, MenuItemDTO dto) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + id));
        validateRestaurantAccess(item.getRestaurant());

        item.setName(dto.getName());
        item.setDescription(dto.getDescription());
        item.setPrice(dto.getPrice());
        item.setCategory(dto.getCategory());
        item.setImageUrl(dto.getImageUrl());
        item.setAvailable(dto.isAvailable());
        item.setDiscountPercentage(normalizeDiscount(dto.getDiscountPercentage()));

        MenuItem updated = menuItemRepository.save(item);
        auditLogService.log("MENU_ITEM_UPDATED", authActor(), "MenuItem", String.valueOf(updated.getId()),
                Map.of("restaurantId", updated.getRestaurant().getId(), "name", updated.getName(), "archived", updated.isArchived()));
        return toDto(updated);
    }

    @Transactional
    public void deleteMenuItem(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + id));
        validateRestaurantAccess(item.getRestaurant());

        item.setArchived(true);
        item.setAvailable(false);
        menuItemRepository.save(item);
        auditLogService.log("MENU_ITEM_ARCHIVED", authActor(), "MenuItem", String.valueOf(id),
                Map.of("restaurantId", item.getRestaurant().getId()));
    }

    private void validateRestaurantAccess(Restaurant restaurant) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found");
        }

        boolean isAdmin = auth.getAuthorities().stream().anyMatch(g -> g.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) {
            return;
        }

        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found: " + email));

        if (user.getRole() == Role.RESTAURANT_ADMIN) {
            boolean manages = user.getManagedRestaurants().stream().anyMatch(r -> r.getId().equals(restaurant.getId()));
            if (!manages) {
                throw new AccessDeniedException("Restaurant admin is not authorized to manage this restaurant");
            }
        } else {
            throw new AccessDeniedException("User is not authorized to manage menu items");
        }
    }

    private MenuItemDTO toDto(MenuItem item) {
        MenuItemDTO dto = MenuItemDTO.fromEntity(item);
        Double rating = reviewRepository.findAverageMenuItemRating(item.getId());
        dto.setRating(rating == null ? 0.0 : Math.round(rating * 10.0) / 10.0);
        dto.setReviewCount(reviewRepository.countMenuItemReviews(item.getId()));
        return dto;
    }

    private List<MenuItemDTO> applySort(List<MenuItemDTO> items, Sort sort) {
        if (sort == null || sort.isUnsorted()) {
            return items;
        }

        Comparator<MenuItemDTO> comparator = null;
        for (Sort.Order order : sort) {
            Comparator<MenuItemDTO> nextComparator = comparatorFor(order.getProperty());
            if (nextComparator == null) {
                continue;
            }

            if (order.getDirection().isDescending()) {
                nextComparator = nextComparator.reversed();
            }

            comparator = comparator == null ? nextComparator : comparator.thenComparing(nextComparator);
        }

        if (comparator == null) {
            return items;
        }

        return items.stream().sorted(comparator).toList();
    }

    private Comparator<MenuItemDTO> comparatorFor(String property) {
        return switch (property) {
            case "name" -> Comparator.comparing(MenuItemDTO::getName, String.CASE_INSENSITIVE_ORDER);
            case "price" -> Comparator.comparing(MenuItemDTO::getPrice);
            case "available" -> Comparator.comparing(MenuItemDTO::isAvailable);
            case "category" -> Comparator.comparing(
                    dto -> dto.getCategory() == null ? "" : dto.getCategory(),
                    String.CASE_INSENSITIVE_ORDER
            );
            case "rating" -> Comparator.comparing(MenuItemDTO::getRating);
            case "reviewCount" -> Comparator.comparing(MenuItemDTO::getReviewCount);
            default -> null;
        };
    }

    private String authActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : "system";
    }

    private BigDecimal normalizeDiscount(BigDecimal discountPercentage) {
        if (discountPercentage == null) {
            return BigDecimal.ZERO;
        }
        if (discountPercentage.compareTo(BigDecimal.ZERO) < 0 || discountPercentage.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Discount percentage must be between 0 and 100.");
        }
        return discountPercentage;
    }
}
