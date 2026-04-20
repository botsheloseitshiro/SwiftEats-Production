package com.swifteats.swifteats.dto.common;

import org.springframework.data.domain.Page;

import java.util.List;

public record PaginatedResponse<T>(
        List<T> content,
        int currentPage,
        int totalPages,
        long totalElements,
        int size,
        boolean first,
        boolean last,
        String sort
) {
    public static <T> PaginatedResponse<T> fromPage(Page<T> page) {
        return new PaginatedResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getTotalPages(),
                page.getTotalElements(),
                page.getSize(),
                page.isFirst(),
                page.isLast(),
                page.getSort().isSorted() ? page.getSort().toString() : "unsorted"
        );
    }
}
