package com.example.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/**
 * Pagination Configuration
 * Centralizes pagination settings for the entire application
 */
@Configuration
@EnableSpringDataWebSupport
public class PaginationConfig implements WebMvcConfigurer {

    @Value("${pagination.default-page-size:20}")
    private int defaultPageSize;

    @Value("${pagination.max-page-size:100}")
    private int maxPageSize;

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        PageableHandlerMethodArgumentResolver resolver = new PageableHandlerMethodArgumentResolver();
        
        // Set default page request
        resolver.setFallbackPageable(PageRequest.of(0, defaultPageSize));
        
        // Set maximum page size to prevent abuse
        resolver.setMaxPageSize(maxPageSize);
        
        // Set one-indexed parameters (page=1 is first page, not page=0)
        resolver.setOneIndexedParameters(false);
        
        resolvers.add(resolver);
    }

    public int getDefaultPageSize() {
        return defaultPageSize;
    }

    public int getMaxPageSize() {
        return maxPageSize;
    }
}
