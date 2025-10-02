package com.example.backend.specs;

import com.example.backend.entities.Application;
import org.springframework.data.jpa.domain.Specification;

public class ApplicationSpecs {
    public static Specification<Application> textSearch(String q) {
        return (root, query, cb) -> {
            if (q == null || q.trim().isEmpty()) return cb.conjunction();
            String like = "%" + q.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), like),
                    cb.like(cb.lower(root.get("description")), like)
            );
        };
    }

    public static Specification<Application> nameLike(String name) {
        return (root, query, cb) -> name == null ? cb.conjunction()
                : cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
    }
}