package com.example.backend.controllers;

import com.example.backend.dtos.RegisterUserRequest;
import com.example.backend.dtos.UserInfo;
import com.example.backend.entities.Alert;
import com.example.backend.entities.Application;
import com.example.backend.entities.User;
import com.example.backend.mappers.UserMapper;
import com.example.backend.services.AlertService;
import com.example.backend.services.PermissionService;
import com.example.backend.services.UserService;
import com.example.backend.validation.ParameterCountValidator;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final AlertService alertService;
    private final PermissionService permissionService;
    private final UserMapper userMapper;

    @GetMapping
    public List<UserInfo> getAllUsers(HttpServletRequest httpRequest) {
        // Validate that no extra parameters are provided
        ParameterCountValidator.validateGetRequest(httpRequest);
        
        List<User> users = userService.getAllUsers();
        return userMapper.toUserInfoList(users);
    }

    @PostMapping
    public User createUser(@Valid @RequestBody RegisterUserRequest request, HttpServletRequest httpRequest) {
        // Validate that no extra parameters are provided
        ParameterCountValidator.validatePostRequest(httpRequest);
        
        return userService.createUser(request);
    }

    @GetMapping("/{userId}/alerts")
    public List<Alert> getUserAlerts(@PathVariable Long userId, HttpServletRequest httpRequest) {
        // Validate that no extra parameters are provided
        ParameterCountValidator.validateGetRequest(httpRequest);
        
        return alertService.getAlertsForUser(userId);
    }

    @GetMapping("/{userId}/applications")
    public List<Application> getUserApplications(@PathVariable Long userId, HttpServletRequest httpRequest) {
        // Validate that no extra parameters are provided
        ParameterCountValidator.validateGetRequest(httpRequest);
        
        return permissionService.getAssignedAppsForUser(userId);
    }
}
