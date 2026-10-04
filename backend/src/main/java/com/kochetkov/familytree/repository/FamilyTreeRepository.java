package com.kochetkov.familytree.repository;

import com.kochetkov.familytree.entity.FamilyTree;
import com.kochetkov.familytree.repository.base.AuditEntityRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface FamilyTreeRepository extends AuditEntityRepository<FamilyTree> {

    @Query("""
        SELECT uft.tree
        FROM UserFamilyTree uft
        WHERE uft.deletedAt IS NULL
            AND uft.tree.deletedAt IS NULL
            AND uft.user.id = :userId
        """)
    List<FamilyTree> findByUserId(Long userId);
}