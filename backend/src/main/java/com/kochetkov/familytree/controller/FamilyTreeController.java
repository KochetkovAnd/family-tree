package com.kochetkov.familytree.controller;

import com.kochetkov.familytree.dto.FamilyTreeDTO;
import com.kochetkov.familytree.service.FamilyTreeService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/family-tree")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class FamilyTreeController {

    FamilyTreeService familyTreeService;

    @GetMapping("/find-by-user/{userId}")
    public List<FamilyTreeDTO> findByUserId(@PathVariable Long userId) {
        return familyTreeService.findByUserId(userId);
    }


}
