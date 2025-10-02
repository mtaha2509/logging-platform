package com.example.backend.mappers;

import com.example.backend.dtos.RegisterUserRequest;
import com.example.backend.dtos.UserInfo;
import com.example.backend.entities.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(RegisterUserRequest request);
    
    UserInfo toUserInfo(User user);
    
    List<UserInfo> toUserInfoList(List<User> users);
}
