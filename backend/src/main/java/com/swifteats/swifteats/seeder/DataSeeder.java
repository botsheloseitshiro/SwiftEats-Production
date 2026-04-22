package com.swifteats.swifteats.seeder;

import com.swifteats.swifteats.model.CardType;
import com.swifteats.swifteats.model.Driver;
import com.swifteats.swifteats.model.FavoriteRestaurant;
import com.swifteats.swifteats.model.FulfillmentType;
import com.swifteats.swifteats.model.MenuItem;
import com.swifteats.swifteats.model.Notification;
import com.swifteats.swifteats.model.NotificationType;
import com.swifteats.swifteats.model.Order;
import com.swifteats.swifteats.model.OrderItem;
import com.swifteats.swifteats.model.OrderStatus;
import com.swifteats.swifteats.model.PaymentMethod;
import com.swifteats.swifteats.model.Restaurant;
import com.swifteats.swifteats.model.Review;
import com.swifteats.swifteats.model.Role;
import com.swifteats.swifteats.model.SavedAddress;
import com.swifteats.swifteats.model.SavedCard;
import com.swifteats.swifteats.model.User;
import com.swifteats.swifteats.repository.DriverRepository;
import com.swifteats.swifteats.repository.FavoriteRestaurantRepository;
import com.swifteats.swifteats.repository.MenuItemRepository;
import com.swifteats.swifteats.repository.NotificationRepository;
import com.swifteats.swifteats.repository.OrderRepository;
import com.swifteats.swifteats.repository.RestaurantRepository;
import com.swifteats.swifteats.repository.ReviewRepository;
import com.swifteats.swifteats.repository.SavedAddressRepository;
import com.swifteats.swifteats.repository.SavedCardRepository;
import com.swifteats.swifteats.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final int DRIVERS_PER_RESTAURANT = 5;

    @Value("${app.seeder.enabled:true}")
    private boolean seederEnabled;

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final DriverRepository driverRepository;
    private final FavoriteRestaurantRepository favoriteRestaurantRepository;
    private final OrderRepository orderRepository;
    private final NotificationRepository notificationRepository;
    private final ReviewRepository reviewRepository;
    private final SavedAddressRepository savedAddressRepository;
    private final SavedCardRepository savedCardRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (!seederEnabled) {
            log.info("Data seeder disabled via property 'app.seeder.enabled=false'.");
            return;
        }

        seedPlatformUsers();
        seedCustomers();
        seedRestaurantNetwork();
        migrateLegacySeedDrivers();
        seedSavedAddresses();
        seedSavedCards();
        seedFavoriteRestaurants();

        if (orderRepository.count() == 0) {
            seedOrders();
        }

        if (reviewRepository.count() == 0) {
            seedReviews();
        }

        seedNotifications();

        log.info("Database seeding complete.");
        logSummary();
    }

    private void seedPlatformUsers() {
        upsertUser(User.builder()
                .fullName("SwiftEats System Admin")
                .email("admin@swifteats.co.za")
                .password(passwordEncoder.encode("AdminPass123!"))
                .phoneNumber("0211234567")
                .address("1 Long Street, Cape Town, 8001")
                .role(Role.ADMIN)
                .active(true)
                .build());

        upsertUser(User.builder()
                .fullName("Platform Operations Manager")
                .email("manager@swifteats.co.za")
                .password(passwordEncoder.encode("ManagerPass123!"))
                .phoneNumber("0111234567")
                .address("15 Alice Lane, Sandton, 2196")
                .role(Role.ADMIN)
                .active(true)
                .build());
    }

    private void seedCustomers() {
        List<User> customers = List.of(
                customer("John Dlamini", "john.dlamini@example.com", "0821234567", "45 Kloof Street, Gardens, Cape Town, 8001"),
                customer("Zanele Mokoena", "zanele.mokoena@example.com", "0839876543", "12 Commissioner Street, Johannesburg, 2001"),
                customer("Amahle Ngubane", "amahle.ngubane@example.com", "0702468135", "789 Coral Street, Durban, 4001"),
                customer("David Chen", "david.chen@example.com", "0761357924", "321 Main Road, Sea Point, Cape Town, 8005"),
                customer("Lerato Khumalo", "lerato.khumalo@example.com", "0731234987", "456 Bryanston Drive, Johannesburg, 2191"),
                customer("Naledi Moeketsi", "naledi.moeketsi@example.com", "0721188776", "101 Nelson Mandela Drive, Bloemfontein, 9301"),
                customer("Thando Maseko", "thando.maseko@example.com", "0714488221", "55 Beach Road, Summerstrand, Gqeberha, 6001"),
                customer("Mpho Kgosi", "mpho.kgosi@example.com", "0782233445", "77 Fatima Bhayat Street, Pretoria, 0002")
        );

        customers.forEach(this::upsertUser);
    }

    private User customer(String fullName, String email, String phoneNumber, String address) {
        return User.builder()
                .fullName(fullName)
                .email(email)
                .password(passwordEncoder.encode("Customer123!"))
                .phoneNumber(phoneNumber)
                .address(address)
                .role(Role.CUSTOMER)
                .active(true)
                .build();
    }

    private void seedRestaurantNetwork() {
        int branchIndex = 0;
        for (BranchSeed branch : restaurantBranches()) {
            User manager = upsertUser(User.builder()
                    .fullName(branch.adminName())
                    .email(branch.adminEmail())
                    .password(passwordEncoder.encode("RestaurantAdmin123!"))
                    .phoneNumber(branch.adminPhone())
                    .address(branch.address() + ", " + branch.city())
                    .role(Role.RESTAURANT_ADMIN)
                    .active(true)
                    .build());

            Restaurant restaurant = upsertRestaurant(branch, manager);
            menuTemplates(branch.brand()).forEach(menuSeed -> upsertMenuItem(restaurant, menuSeed));
            seedDriversForRestaurant(restaurant, branchIndex++);
        }
    }

    private void seedSavedAddresses() {
        List<User> customers = userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.CUSTOMER)
                .toList();

        for (User customer : customers) {
            ensureSavedAddress(customer, "Home", customer.getAddress(), true);
            ensureSavedAddress(customer, "Work", alternativeAddress(customer), false);
        }
    }

    private void seedSavedCards() {
        List<User> customers = userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.CUSTOMER)
                .sorted(Comparator.comparing(User::getEmail))
                .toList();

        for (int i = 0; i < customers.size(); i++) {
            User customer = customers.get(i);
            CardType cardType = i % 2 == 0 ? CardType.VISA : CardType.MASTERCARD;
            String lastFour = String.format("%04d", 4200 + i);
            ensureSavedCard(customer, cardType, customer.getFullName(), lastFour, 10 + (i % 2), 2029, true);
        }
    }

    private void seedFavoriteRestaurants() {
        List<User> customers = userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.CUSTOMER)
                .sorted(Comparator.comparing(User::getEmail))
                .toList();
        List<Restaurant> restaurants = restaurantRepository.findByActiveTrue().stream()
                .sorted(Comparator.comparing(Restaurant::getName, Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(Restaurant::getCity, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();

        if (customers.isEmpty() || restaurants.isEmpty()) {
            return;
        }

        for (int i = 0; i < customers.size(); i++) {
            User customer = customers.get(i);
            for (int offset = 0; offset < 3 && offset < restaurants.size(); offset++) {
                Restaurant restaurant = restaurants.get((i * 2 + offset) % restaurants.size());
                if (favoriteRestaurantRepository.existsByUserIdAndRestaurantId(customer.getId(), restaurant.getId())) {
                    continue;
                }

                favoriteRestaurantRepository.save(FavoriteRestaurant.builder()
                        .user(customer)
                        .restaurant(restaurant)
                        .build());
            }
        }
    }

    private void seedOrders() {
        List<User> customers = userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.CUSTOMER)
                .sorted(Comparator.comparing(User::getEmail))
                .toList();
        List<Restaurant> restaurants = restaurantRepository.findByActiveTrue().stream()
                .sorted(Comparator.comparing(Restaurant::getId))
                .toList();
        if (customers.isEmpty() || restaurants.isEmpty()) {
            return;
        }

        OrderStatus[] statuses = {
                OrderStatus.DELIVERED,
                OrderStatus.CONFIRMED,
                OrderStatus.PREPARING,
                OrderStatus.OUT_FOR_DELIVERY,
                OrderStatus.PENDING
        };

        int created = 0;
        for (int i = 0; i < customers.size(); i++) {
            User customer = customers.get(i);
            for (int j = 0; j < 2; j++) {
                Restaurant restaurant = restaurants.get((i * 3 + j) % restaurants.size());
                List<MenuItem> availableItems = menuItemRepository.findByRestaurantIdAndArchivedFalseAndAvailableTrue(restaurant.getId());
                if (availableItems.size() < 2) {
                    continue;
                }

                OrderStatus status = statuses[(i + j) % statuses.length];
                FulfillmentType fulfillmentType = j % 2 == 0 ? FulfillmentType.DELIVERY : FulfillmentType.COLLECTION;
                PaymentMethod paymentMethod = j % 2 == 0 ? PaymentMethod.CARD : PaymentMethod.CASH_ON_DELIVERY;
                List<Driver> restaurantDrivers = driverRepository.findByRestaurantId(restaurant.getId(), Pageable.unpaged())
                        .getContent().stream()
                        .sorted(Comparator.comparing(Driver::getId))
                        .toList();
                Driver driver = (status != OrderStatus.PENDING && status != OrderStatus.CANCELLED && fulfillmentType == FulfillmentType.DELIVERY && !restaurantDrivers.isEmpty())
                        ? restaurantDrivers.get((i + j) % restaurantDrivers.size())
                        : null;

                Order order = Order.builder()
                        .user(customer)
                        .restaurant(restaurant)
                        .status(status)
                        .fulfillmentType(fulfillmentType)
                        .paymentMethod(paymentMethod)
                        .deliveryAddress(fulfillmentType == FulfillmentType.DELIVERY ? customer.getAddress() : null)
                        .deliveryFee(fulfillmentType == FulfillmentType.DELIVERY ? money(restaurant.getDeliveryFee()) : money(0))
                        .tipAmount(fulfillmentType == FulfillmentType.DELIVERY ? money(12 + j) : money(0))
                        .driver(driver)
                        .cardType(paymentMethod == PaymentMethod.CARD ? CardType.VISA : null)
                        .cardLastFour(paymentMethod == PaymentMethod.CARD ? "4242" : null)
                        .subtotalAmount(money(0))
                        .totalAmount(money(0))
                        .scheduledFor(status == OrderStatus.PENDING && j == 1 ? LocalDateTime.now().plusHours(3 + i) : null)
                        .notes(j == 0 ? "Please ring the bell at the gate." : "Customer will collect in store.")
                        .orderItems(new ArrayList<>())
                        .build();

                BigDecimal subtotal = BigDecimal.ZERO;
                for (int k = 0; k < 2; k++) {
                    MenuItem item = availableItems.get(k);
                    int quantity = k + 1;
                    BigDecimal itemSubtotal = item.getDiscountedPrice().multiply(BigDecimal.valueOf(quantity));
                    subtotal = subtotal.add(itemSubtotal);
                    order.getOrderItems().add(OrderItem.builder()
                            .order(order)
                            .menuItem(item)
                            .itemName(item.getName())
                            .unitPrice(item.getDiscountedPrice())
                            .quantity(quantity)
                            .subtotal(itemSubtotal)
                            .build());
                }

                order.setSubtotalAmount(money(subtotal));
                order.setTotalAmount(money(subtotal.add(order.getDeliveryFee()).add(order.getTipAmount())));
                orderRepository.save(order);
                created++;
            }
        }

        log.info("Seeded {} orders.", created);
    }

    private void seedReviews() {
        List<Order> deliveredOrders = orderRepository.findByStatus(OrderStatus.DELIVERED);
        for (Order order : deliveredOrders) {
            reviewRepository.save(Review.builder()
                    .user(order.getUser())
                    .order(order)
                    .restaurant(order.getRestaurant())
                    .rating(4 + (int) (order.getId() % 2))
                    .comment("Reliable delivery and great food.")
                    .build());

            if (!order.getOrderItems().isEmpty()) {
                MenuItem firstItem = order.getOrderItems().get(0).getMenuItem();
                reviewRepository.save(Review.builder()
                        .user(order.getUser())
                        .order(order)
                        .restaurant(order.getRestaurant())
                        .menuItem(firstItem)
                        .rating(4)
                        .comment("Fresh and worth ordering again.")
                        .build());
            }
        }
    }

    private User upsertUser(User user) {
        return userRepository.findByEmail(user.getEmail())
                .map(existing -> {
                    existing.setFullName(user.getFullName());
                    existing.setPassword(user.getPassword());
                    existing.setPhoneNumber(user.getPhoneNumber());
                    existing.setAddress(user.getAddress());
                    existing.setRole(user.getRole());
                    existing.setActive(user.isActive());
                    return userRepository.save(existing);
                })
                .orElseGet(() -> userRepository.save(user));
    }

    private void seedDriversForRestaurant(Restaurant restaurant, int branchIndex) {
        String[] firstNames = {"Sipho", "Thabo", "Lerato", "Nomsa", "Ayanda", "Kagiso", "Mbali", "Sibusiso", "Zola", "Anele"};
        String[] lastNames = {"Ndlovu", "Mokoena", "Dlamini", "Khumalo", "Naidoo", "Mabaso", "Petersen", "Mthembu", "Molefe", "Cele"};
        String[] vehicleTypes = {"Motorcycle", "Scooter", "Car", "Bicycle"};
        List<String> expectedEmails = new ArrayList<>();
        for (int driverIndex = 0; driverIndex < DRIVERS_PER_RESTAURANT; driverIndex++) {
            String fullName = firstNames[driverIndex % firstNames.length] + " "
                    + lastNames[(branchIndex + driverIndex) % lastNames.length];
            String email = buildDriverEmail(fullName, restaurant, null);
            expectedEmails.add(email);
            User user = upsertUser(User.builder()
                    .fullName(fullName)
                    .email(email)
                    .password(passwordEncoder.encode("Driver123!"))
                    .phoneNumber(String.format("07%08d", Math.abs((branchIndex + 1) * 100 + driverIndex) % 100000000))
                    .address(restaurant.getAddress() + ", " + restaurant.getCity())
                    .role(Role.DRIVER)
                    .active(true)
                    .build());

            upsertDriverProfile(user, restaurant,
                    vehicleTypes[(branchIndex + driverIndex) % vehicleTypes.length],
                    buildLicensePlate(branchIndex, driverIndex),
                    driverIndex % 3 != 0,
                    25 + (branchIndex * 10) + driverIndex);
        }
        deactivateUnexpectedSeedDrivers(restaurant, expectedEmails);
    }

    private String buildLicensePlate(int branchIndex, int driverIndex) {
        String province = switch (branchIndex % 5) {
            case 0 -> "GP";
            case 1 -> "WC";
            case 2 -> "KZN";
            case 3 -> "FS";
            default -> "NW";
        };
        return province + " " + String.format("%02d", (branchIndex + 11) % 99) + " SW " + String.format("%03d", driverIndex + 101);
    }

    private Driver upsertDriverProfile(User user, Restaurant restaurant, String vehicleType, String licensePlate, boolean available, Integer totalDeliveries) {
        return driverRepository.findByUserId(user.getId())
                .map(existing -> {
                    existing.setRestaurant(restaurant);
                    existing.setVehicleType(vehicleType);
                    existing.setLicensePlate(licensePlate);
                    existing.setAvailable(available);
                    existing.setActive(true);
                    existing.setOnline(available);
                    existing.setTotalDeliveries(totalDeliveries);
                    return driverRepository.save(existing);
                })
                .orElseGet(() -> driverRepository.save(Driver.builder()
                        .user(user)
                        .restaurant(restaurant)
                        .vehicleType(vehicleType)
                        .licensePlate(licensePlate)
                        .available(available)
                        .active(true)
                        .online(available)
                        .totalDeliveries(totalDeliveries)
                        .build()));
    }

    private void deactivateUnexpectedSeedDrivers(Restaurant restaurant, List<String> expectedEmails) {
        String restaurantDomain = "@" + slugify(restaurant.getName()) + ".co.za";
        driverRepository.findByRestaurantId(restaurant.getId(), Pageable.unpaged()).getContent().stream()
                .filter(driver -> driver.getUser() != null && driver.getUser().getEmail() != null)
                .filter(driver -> driver.getUser().getEmail().toLowerCase(Locale.ROOT).endsWith(restaurantDomain))
                .filter(driver -> !expectedEmails.contains(driver.getUser().getEmail().toLowerCase(Locale.ROOT)))
                .forEach(driver -> {
                    driver.setActive(false);
                    driver.setAvailable(false);
                    driver.setOnline(false);
                    driverRepository.save(driver);

                    driver.getUser().setActive(false);
                    userRepository.save(driver.getUser());
                });
    }

    private void migrateLegacySeedDrivers() {
        int updatedEmails = 0;
        int deactivatedLegacyDrivers = 0;

        List<Driver> drivers = driverRepository.findAll();
        for (Driver driver : drivers) {
            if (driver.getUser() == null) {
                continue;
            }

            User user = driver.getUser();
            if (user.getRole() != Role.DRIVER || user.getEmail() == null) {
                continue;
            }

            String email = user.getEmail().toLowerCase(Locale.ROOT);
            boolean looksLegacy = email.endsWith("@driver.co.za")
                    || email.endsWith("@swifteats.com")
                    || (email.endsWith("@swifteats.co.za") && email.startsWith("driver."))
                    || (driver.getRestaurant() != null && !email.endsWith("@" + slugify(driver.getRestaurant().getName()) + ".co.za"));
            if (!looksLegacy) {
                continue;
            }

            if (driver.getRestaurant() != null) {
                String desiredEmail = buildDriverEmail(driver.getUser().getFullName(), driver.getRestaurant(), driver.getId());
                if (!desiredEmail.equalsIgnoreCase(user.getEmail())) {
                    user.setEmail(desiredEmail);
                    userRepository.save(user);
                    updatedEmails++;
                }
            } else {
                driver.setActive(false);
                driver.setAvailable(false);
                driver.setOnline(false);
                driverRepository.save(driver);

                user.setActive(false);
                userRepository.save(user);
                deactivatedLegacyDrivers++;
            }
        }

        if (updatedEmails > 0 || deactivatedLegacyDrivers > 0) {
            log.info("Driver seed migration applied. Updated emails: {}, deactivated legacy unscoped drivers: {}",
                    updatedEmails, deactivatedLegacyDrivers);
        }
    }

    private String buildDriverEmail(String fullName, Restaurant restaurant, Long driverId) {
        String driverSlug = slugify(fullName);
        String restaurantSlug = slugify(restaurant.getName());
        String base = driverSlug + "@" + restaurantSlug + ".co.za";
        User existingUser = userRepository.findByEmail(base).orElse(null);
        if (existingUser == null || existingUser.getFullName().equalsIgnoreCase(fullName)) {
            return base;
        }
        if (driverId != null) {
            return driverSlug + "." + driverId + "@" + restaurantSlug + ".co.za";
        }
        return driverSlug + ".branch@" + restaurantSlug + ".co.za";
    }

    private String slugify(String value) {
        return value.toLowerCase(Locale.ROOT)
                .replace("'", "")
                .replace("&", "and")
                .replaceAll("[^a-z0-9]+", ".")
                .replaceAll("^\\.+|\\.+$", "");
    }

    private void seedNotifications() {
        for (User user : userRepository.findAll()) {
            List<Notification> existingNotifications = new ArrayList<>(
                    notificationRepository.findByUserId(user.getId(), Pageable.unpaged()).getContent()
            );
            if (!existingNotifications.isEmpty()) {
                notificationRepository.deleteAll(existingNotifications);
            }

            notificationRepository.save(Notification.builder()
                    .user(user)
                    .type(NotificationType.SYSTEM)
                    .title("Welcome to SwiftEats")
                    .message("Your account is ready and your dashboard has been prepared with live demo data.")
                    .referenceType("User")
                    .referenceId(String.valueOf(user.getId()))
                    .build());

            notificationRepository.save(Notification.builder()
                    .user(user)
                    .type(roleNotificationType(user))
                    .title(roleNotificationTitle(user))
                    .message(roleNotificationMessage(user))
                    .referenceType("User")
                    .referenceId(String.valueOf(user.getId()))
                    .build());
        }
    }

    private NotificationType roleNotificationType(User user) {
        return switch (user.getRole()) {
            case DRIVER -> NotificationType.DRIVER_ASSIGNMENT;
            case RESTAURANT_ADMIN -> NotificationType.ORDER_UPDATE;
            case CUSTOMER -> NotificationType.PROMOTION;
            default -> NotificationType.SYSTEM;
        };
    }

    private String roleNotificationTitle(User user) {
        return switch (user.getRole()) {
            case DRIVER -> "Shift and delivery update";
            case RESTAURANT_ADMIN -> "Branch activity update";
            case CUSTOMER -> "Recommended for tonight";
            default -> "Platform readiness update";
        };
    }

    private String roleNotificationMessage(User user) {
        return switch (user.getRole()) {
            case DRIVER -> "You have active branch deliveries in your dashboard and your location sharing tools are ready.";
            case RESTAURANT_ADMIN -> "Your branch menu, drivers, and trading hours are ready for today's operations.";
            case CUSTOMER -> "New meals, scheduled delivery slots, and recent orders are available in your account.";
            default -> "Seed data has been refreshed and the platform is ready for validation.";
        };
    }

    private Restaurant upsertRestaurant(BranchSeed seed, User manager) {
        return restaurantRepository.findByNameIgnoreCaseAndAddressIgnoreCase(seed.brand(), seed.address())
                .map(existing -> {
                    applyRestaurantSeed(existing, seed, manager);
                    return restaurantRepository.save(existing);
                })
                .orElseGet(() -> restaurantRepository.save(buildRestaurant(seed, manager)));
    }

    private Restaurant buildRestaurant(BranchSeed seed, User manager) {
        Restaurant restaurant = new Restaurant();
        applyRestaurantSeed(restaurant, seed, manager);
        return restaurant;
    }

    private void applyRestaurantSeed(Restaurant restaurant, BranchSeed seed, User manager) {
        restaurant.setName(seed.brand());
        restaurant.setDescription(seed.description());
        restaurant.setAddress(seed.address());
        restaurant.setCity(seed.city());
        restaurant.setLatitude(seed.latitude());
        restaurant.setLongitude(seed.longitude());
        restaurant.setDeliveryRadiusKm(seed.deliveryRadiusKm());
        restaurant.setCategory(seed.category());
        restaurant.setImageUrl(seed.imageUrl());
        restaurant.setDeliveryTimeMinutes(seed.deliveryTimeMinutes());
        restaurant.setDeliveryFee(money(seed.deliveryFee()));
        restaurant.setRating(seed.rating());
        restaurant.setManager(manager);
        restaurant.setActive(true);
        restaurant.setAcceptingOrders(true);
        restaurant.setPauseOrdersUntil(null);
        restaurant.setHolidayHours(null);
        restaurant.setMondayHours("07:30-21:00");
        restaurant.setTuesdayHours("07:30-21:00");
        restaurant.setWednesdayHours("07:30-21:00");
        restaurant.setThursdayHours("07:30-21:00");
        restaurant.setFridayHours("07:30-22:00");
        restaurant.setSaturdayHours("08:00-22:00");
        restaurant.setSundayHours("08:00-20:00");
    }

    private void upsertMenuItem(Restaurant restaurant, MenuSeed menuSeed) {
        MenuItem menuItem = menuItemRepository.findByRestaurantIdAndNameIgnoreCase(restaurant.getId(), menuSeed.name())
                .orElseGet(MenuItem::new);
        menuItem.setRestaurant(restaurant);
        menuItem.setName(menuSeed.name());
        menuItem.setDescription(menuSeed.description());
        menuItem.setPrice(money(menuSeed.price()));
        menuItem.setCategory(menuSeed.category());
        menuItem.setImageUrl(menuSeed.imageUrl());
        menuItem.setAvailable(true);
        menuItem.setArchived(false);
        menuItem.setDiscountPercentage(money(menuSeed.discountPercentage()));
        menuItemRepository.save(menuItem);
    }

    private void ensureSavedAddress(User user, String label, String address, boolean isDefault) {
        if (address == null || address.isBlank()) {
            return;
        }

        boolean exists = savedAddressRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(user.getId()).stream()
                .anyMatch(savedAddress -> savedAddress.getLabel().equalsIgnoreCase(label));
        if (exists) {
            return;
        }

        savedAddressRepository.save(SavedAddress.builder()
                .user(user)
                .label(label)
                .addressLine(address)
                .isDefault(isDefault)
                .build());
    }

    private void ensureSavedCard(User user, CardType cardType, String cardHolderName, String lastFour, int expiryMonth, int expiryYear, boolean isDefault) {
        boolean exists = savedCardRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(user.getId()).stream()
                .anyMatch(savedCard -> savedCard.getLastFourDigits().equals(lastFour));
        if (exists) {
            return;
        }

        savedCardRepository.save(SavedCard.builder()
                .user(user)
                .cardType(cardType)
                .cardHolderName(cardHolderName)
                .lastFourDigits(lastFour)
                .expiryMonth(expiryMonth)
                .expiryYear(expiryYear)
                .isDefault(isDefault)
                .build());
    }

    private String alternativeAddress(User customer) {
        return switch (customer.getEmail().toLowerCase(Locale.ROOT)) {
            case "john.dlamini@example.com" -> "101 Gardens Centre, Cape Town, 8001";
            case "zanele.mokoena@example.com" -> "82 Rivonia Road, Sandton, 2196";
            case "amahle.ngubane@example.com" -> "21 Florida Road, Durban, 4001";
            case "david.chen@example.com" -> "89 Regent Road, Sea Point, Cape Town, 8005";
            case "lerato.khumalo@example.com" -> "17 Winnie Mandela Drive, Bryanston, 2021";
            case "naledi.moeketsi@example.com" -> "31 Nelson Mandela Drive, Bloemfontein, 9301";
            case "thando.maseko@example.com" -> "Summerbreeze Centre, Summerstrand, Gqeberha, 6001";
            default -> "15 Church Square, Pretoria, 0002";
        };
    }

    private BigDecimal money(double value) {
        return BigDecimal.valueOf(value).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private List<MenuSeed> menuTemplates(String brand) {
        return switch (brand) {
            case "KFC" -> List.of(
                    new MenuSeed("Streetwise 2 with Chips", "Crispy chicken pieces with seasoned chips.", 64.90, "Mains", "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400", 0),
                    new MenuSeed("Zinger Burger", "Spicy chicken fillet burger with fresh lettuce.", 56.90, "Burgers", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400", 10),
                    new MenuSeed("Crunch Burger", "Crunchy chicken burger with creamy mayo.", 44.90, "Burgers", "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400", 0),
                    new MenuSeed("Buddy Coke", "Ice cold 440ml soft drink.", 21.90, "Drinks", "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400", 0)
            );
            case "Nando's" -> List.of(
                    new MenuSeed("Quarter Chicken", "Flame-grilled quarter chicken with PERi-PERi.", 89.00, "Mains", "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400", 0),
                    new MenuSeed("Half Chicken", "Generous half chicken grilled to juicy perfection.", 149.00, "Mains", "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400", 15),
                    new MenuSeed("Chicken Wrap", "Chicken strips, lettuce, tomato and PERi-PERi mayo.", 109.00, "Wraps", "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400", 0),
                    new MenuSeed("Spicy Rice", "Fluffy spiced basmati rice.", 39.00, "Sides", "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400", 0)
            );
            case "Roman's Pizza", "Debonairs Pizza" -> List.of(
                    new MenuSeed("Margherita", "Classic cheese pizza with tomato base.", 99.00, "Pizzas", "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400", 0),
                    new MenuSeed("BBQ Chicken", "Smoky BBQ chicken pizza with onion.", 139.00, "Pizzas", "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400", 12),
                    new MenuSeed("Meat Feast", "Loaded pizza with beef, ham and salami.", 149.00, "Pizzas", "https://images.unsplash.com/photo-1548365328-9f547fb0953b?w=400", 10),
                    new MenuSeed("Garlic Bread", "Freshly baked garlic bread.", 39.00, "Sides", "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", 0)
            );
            case "Steers", "Burger King", "Wimpy" -> List.of(
                    new MenuSeed("Classic Burger", "Signature flame-grilled burger.", 79.00, "Burgers", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400", 0),
                    new MenuSeed("Cheese Burger", "Burger topped with melted cheese.", 89.00, "Burgers", "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400", 0),
                    new MenuSeed("Loaded Fries", "Golden fries with seasoning.", 34.00, "Sides", "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400", 0),
                    new MenuSeed("Milkshake", "Creamy vanilla milkshake.", 29.00, "Drinks", "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400", 5)
            );
            case "Kauai" -> List.of(
                    new MenuSeed("Chicken Avo Wrap", "Toasted wrap with grilled chicken and avocado.", 92.00, "Wraps", "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400", 0),
                    new MenuSeed("Harvest Bowl", "Healthy bowl with grains, greens and protein.", 109.00, "Bowls", "https://images.unsplash.com/photo-1547592180-85f173990554?w=400", 0),
                    new MenuSeed("Protein Berry Smoothie", "Berry smoothie packed with protein.", 59.00, "Drinks", "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400", 15),
                    new MenuSeed("Almond Butter Slice", "Nutty snack bar.", 34.00, "Snacks", "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400", 0)
            );
            case "Fishaways" -> List.of(
                    new MenuSeed("Hake and Chips", "Golden hake with chips.", 94.00, "Mains", "https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=400", 0),
                    new MenuSeed("Calamari Combo", "Tender calamari with rice.", 112.00, "Mains", "https://images.unsplash.com/photo-1559847844-5315695dadae?w=400", 0),
                    new MenuSeed("Prawn Rice Bowl", "Prawns on savoury rice.", 129.00, "Bowls", "https://images.unsplash.com/photo-1563379091339-03246963d29d?w=400", 10),
                    new MenuSeed("Tartar Dip", "Creamy tartar side.", 12.00, "Sides", "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400", 0)
            );
            default -> List.of(
                    new MenuSeed("Chicken Meal", "Popular branch favourite.", 85.00, "Mains", "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400", 0),
                    new MenuSeed("House Special", "Signature item from the kitchen.", 95.00, "Mains", "https://images.unsplash.com/photo-1544025162-d76694265947?w=400", 0),
                    new MenuSeed("Fries", "Crispy fries.", 28.00, "Sides", "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400", 0),
                    new MenuSeed("Soft Drink", "Chilled soft drink.", 20.00, "Drinks", "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400", 0)
            );
        };
    }

    private List<BranchSeed> restaurantBranches() {
        return List.of(
                branch("KFC", "Summerstrand", "Gqeberha", "Summerstrand Village, Marine Drive", -33.9817, 25.6627, "Chicken"),
                branch("KFC", "Rustenburg", "Rustenburg", "88 Nelson Mandela Drive", -25.6676, 27.2420, "Chicken"),
                branch("KFC", "Johannesburg CBD", "Johannesburg", "120 Commissioner Street", -26.2041, 28.0473, "Chicken"),
                branch("KFC", "Durban North", "Durban", "45 Northway Mall, Broadway", -29.7897, 31.0351, "Chicken"),
                branch("KFC", "Pretoria Central", "Pretoria", "17 Church Square", -25.7479, 28.2293, "Chicken"),

                branch("Nando's", "Sandton", "Johannesburg", "Sandton City, Rivonia Road", -26.1076, 28.0567, "Chicken"),
                branch("Nando's", "Waterfront", "Cape Town", "19 Dock Road, V&A Waterfront", -33.9036, 18.4219, "Chicken"),
                branch("Nando's", "Gateway", "Umhlanga", "Gateway Theatre of Shopping", -29.7266, 31.0664, "Chicken"),
                branch("Nando's", "West Acres", "Nelspruit", "1 Madiba Drive", -25.4658, 30.9853, "Chicken"),
                branch("Nando's", "North Beach", "Durban", "125 Snell Parade", -29.8486, 31.0360, "Chicken"),

                branch("Roman's Pizza", "Rosebank", "Johannesburg", "16 Baker Street", -26.1459, 28.0416, "Pizza"),
                branch("Roman's Pizza", "Stellenbosch", "Stellenbosch", "43 Andringa Street", -33.9361, 18.8610, "Pizza"),
                branch("Roman's Pizza", "Summerstrand", "Gqeberha", "5 Admiralty Way", -33.9783, 25.6708, "Pizza"),
                branch("Roman's Pizza", "Rustenburg Square", "Rustenburg", "42 Fatima Bhayat Street", -25.6673, 27.2410, "Pizza"),
                branch("Roman's Pizza", "Hatfield", "Pretoria", "1099 Burnett Street", -25.7485, 28.2370, "Pizza"),

                branch("Debonairs Pizza", "Bayside", "Cape Town", "Bayside Mall, Table View", -33.8281, 18.4856, "Pizza"),
                branch("Debonairs Pizza", "Morningside", "Durban", "Florida Road Junction", -29.8254, 31.0193, "Pizza"),
                branch("Debonairs Pizza", "Bloemfontein CBD", "Bloemfontein", "35 Maitland Street", -29.1183, 26.2140, "Pizza"),
                branch("Debonairs Pizza", "Polokwane Central", "Polokwane", "19 Schoeman Street", -23.9045, 29.4689, "Pizza"),
                branch("Debonairs Pizza", "Potchefstroom", "Potchefstroom", "82 Walter Sisulu Avenue", -26.7145, 27.0970, "Pizza"),

                branch("Steers", "Centurion", "Centurion", "Centurion Mall, Heuwel Avenue", -25.8603, 28.1881, "Burgers"),
                branch("Steers", "Tyger Valley", "Cape Town", "Tyger Valley Centre", -33.8750, 18.6313, "Burgers"),
                branch("Steers", "Mimosa", "Bloemfontein", "131 Kellner Street", -29.1059, 26.1700, "Burgers"),
                branch("Steers", "Northgate", "Rustenburg", "Northgate Shopping Centre", -25.6403, 27.2346, "Burgers"),
                branch("Steers", "The Glen", "Johannesburg", "The Glen Shopping Centre", -26.2698, 28.0490, "Burgers"),

                branch("Burger King", "Canal Walk", "Cape Town", "Canal Walk Shopping Centre", -33.8925, 18.5108, "Burgers"),
                branch("Burger King", "Maponya", "Soweto", "Maponya Mall", -26.2678, 27.8894, "Burgers"),
                branch("Burger King", "Suncoast", "Durban", "Suncoast Casino", -29.8309, 31.0396, "Burgers"),
                branch("Burger King", "Menlyn", "Pretoria", "Menlyn Park Shopping Centre", -25.7853, 28.2750, "Burgers"),
                branch("Burger King", "Greenacres", "Gqeberha", "Greenacres Shopping Centre", -33.9385, 25.5614, "Burgers"),

                branch("Kauai", "Sea Point", "Cape Town", "76 Regent Road", -33.9150, 18.3898, "Healthy"),
                branch("Kauai", "Rosebank", "Johannesburg", "The Zone, Oxford Road", -26.1454, 28.0409, "Healthy"),
                branch("Kauai", "Walmer", "Gqeberha", "Walmer Park Shopping Centre", -33.9745, 25.5851, "Healthy"),
                branch("Kauai", "Watercrest", "Durban", "Watercrest Mall", -29.8006, 30.8365, "Healthy"),
                branch("Kauai", "Centurion Lifestyle", "Centurion", "Lenchen Avenue", -25.8424, 28.1906, "Healthy"),

                branch("Wimpy", "Eastgate", "Johannesburg", "Eastgate Shopping Centre", -26.1817, 28.1558, "Breakfast"),
                branch("Wimpy", "Blue Route", "Cape Town", "Blue Route Mall", -34.0651, 18.4446, "Breakfast"),
                branch("Wimpy", "Boardwalk", "Gqeberha", "Boardwalk Mall", -33.9825, 25.6545, "Breakfast"),
                branch("Wimpy", "Liberty Midlands", "Pietermaritzburg", "Liberty Midlands Mall", -29.6016, 30.3787, "Breakfast"),
                branch("Wimpy", "Waterfall Mall", "Rustenburg", "Augrabies Avenue", -25.6965, 27.2407, "Breakfast"),

                branch("Fishaways", "Claremont", "Cape Town", "Cavendish Square", -33.9794, 18.4658, "Seafood"),
                branch("Fishaways", "Mabopane", "Pretoria", "Morula Sun Mall", -25.4972, 28.1008, "Seafood"),
                branch("Fishaways", "Kingsburgh", "Durban", "Kingsburgh Centre", -30.0500, 30.8817, "Seafood"),
                branch("Fishaways", "Welkom Central", "Welkom", "Stateway Street", -27.9972, 26.7344, "Seafood"),
                branch("Fishaways", "Polokwane Mall", "Polokwane", "Mall of the North", -23.8663, 29.4509, "Seafood"),

                branch("Chicken Licken", "Alexandra", "Johannesburg", "Pan Africa Mall", -26.1036, 28.0978, "Chicken"),
                branch("Chicken Licken", "Khayelitsha", "Cape Town", "Site B Plaza", -34.0380, 18.6750, "Chicken"),
                branch("Chicken Licken", "Kwamashu", "Durban", "Bridge City Mall", -29.7486, 30.9996, "Chicken"),
                branch("Chicken Licken", "Soshanguve", "Pretoria", "Soshanguve Crossing", -25.5388, 28.0980, "Chicken"),
                branch("Chicken Licken", "Phokeng", "Rustenburg", "2 Royal Bafokeng Avenue", -25.5777, 27.1599, "Chicken")
        );
    }

    private BranchSeed branch(String brand, String area, String city, String address, double latitude, double longitude, String category) {
        String slug = (brand + "." + area).toLowerCase(Locale.ROOT)
                .replace("'", "")
                .replace("&", "and")
                .replaceAll("[^a-z0-9]+", ".");
        String imageUrl = switch (category) {
            case "Chicken" -> "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=600";
            case "Pizza" -> "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600";
            case "Healthy" -> "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600";
            case "Seafood" -> "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600";
            case "Breakfast" -> "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600";
            default -> "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600";
        };
        return new BranchSeed(
                brand,
                area,
                city,
                address,
                latitude,
                longitude,
                category,
                brand + " " + area + " branch serving " + city + " with reliable delivery coverage.",
                imageUrl,
                25 + Math.abs(city.hashCode() % 10),
                25 + Math.abs(area.hashCode() % 20),
                10.0,
                4.2 + (Math.abs(area.hashCode() % 5) * 0.1),
                toTitleCase(brand + " " + area + " Admin"),
                "admin." + slug + "@swifteats.co.za",
                "0" + (10 + Math.abs(area.hashCode() % 80)) + "555" + String.format("%04d", Math.abs(slug.hashCode()) % 10000)
        );
    }

    private String toTitleCase(String value) {
        String[] parts = value.split("\\s+");
        StringBuilder builder = new StringBuilder();
        for (String part : parts) {
            if (part.isBlank()) {
                continue;
            }
            if (!builder.isEmpty()) {
                builder.append(' ');
            }
            builder.append(Character.toUpperCase(part.charAt(0)));
            if (part.length() > 1) {
                builder.append(part.substring(1));
            }
        }
        return builder.toString();
    }

    private void logSummary() {
        log.info("System admins: admin@swifteats.co.za / AdminPass123!, manager@swifteats.co.za / ManagerPass123!");
        log.info("Customer password: Customer123!");
        log.info("Driver password: Driver123!");
        log.info("Restaurant admin password: RestaurantAdmin123!");
        log.info("Restaurants seeded: {}", restaurantRepository.count());
        log.info("Restaurant admins seeded: {}", userRepository.findAll().stream().filter(user -> user.getRole() == Role.RESTAURANT_ADMIN).count());
        log.info("Drivers seeded: {}", driverRepository.count());
        log.info("Orders seeded: {}", orderRepository.count());
        log.info("Reviews seeded: {}", reviewRepository.count());
    }

    private record MenuSeed(
            String name,
            String description,
            double price,
            String category,
            String imageUrl,
            double discountPercentage
    ) {
    }

    private record BranchSeed(
            String brand,
            String area,
            String city,
            String address,
            double latitude,
            double longitude,
            String category,
            String description,
            String imageUrl,
            int deliveryTimeMinutes,
            int deliveryFee,
            double deliveryRadiusKm,
            double rating,
            String adminName,
            String adminEmail,
            String adminPhone
    ) {
    }
}
