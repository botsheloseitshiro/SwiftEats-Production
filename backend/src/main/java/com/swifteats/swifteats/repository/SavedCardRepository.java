package com.swifteats.swifteats.repository;

import com.swifteats.swifteats.model.SavedCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedCardRepository extends JpaRepository<SavedCard, Long> {

    List<SavedCard> findByUserIdOrderByIsDefaultDescCreatedAtAsc(Long userId);

    Optional<SavedCard> findByIdAndUserId(Long id, Long userId);
}
