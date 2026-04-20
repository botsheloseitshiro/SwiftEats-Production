package com.swifteats.swifteats.repository;

import com.swifteats.swifteats.model.SavedAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedAddressRepository extends JpaRepository<SavedAddress, Long> {

    List<SavedAddress> findByUserIdOrderByIsDefaultDescCreatedAtAsc(Long userId);

    Optional<SavedAddress> findByIdAndUserId(Long id, Long userId);
}
