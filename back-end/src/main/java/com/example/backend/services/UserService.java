package com.example.backend.services;

import com.example.backend.dtos.RegisterUserRequest;
import com.example.backend.entities.User;
import com.example.backend.mappers.UserMapper;
import com.example.backend.repositories.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User createUser(RegisterUserRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("A user with email '" + request.getEmail() + "' already exists");
        }
        User user = userMapper.toUser(request);
        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email){
        return userRepository.findByEmail(email);
    }

    @Transactional
    public void processOAuth2User(OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        if (email == null) {
            throw new IllegalStateException("Email not found from OAuth2 provider");
        }
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            RegisterUserRequest newUserRequest = new RegisterUserRequest();
            newUserRequest.setEmail(email);

            User newUser = userMapper.toUser(newUserRequest);
            userRepository.save(newUser);
            System.out.println("Saved new user: " + email);
        } else {
            System.out.println("User already exists: " + email);
        }
    }
}