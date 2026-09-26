package com.kochetkov.familytree.repository;

import com.kochetkov.familytree.entity.UserFamilyTree;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserFamilyTreeRepository extends JpaRepository<UserFamilyTree, Long> {

    List<UserFamilyTree> findAllByUserId(Long userId);

    boolean existsByUserIdAndTreeId(Long userId, Long treeId);
}
