---
title: "two-sum"
slug: "two-sum"
date: "2019-02-14T18:06"
tags: ["golang"]
description: "最近刚好在学golang，所以就拿简单的LeetCode提来练习练习，顺便把结果分享下"
---

最近刚好在学golang，所以就拿简单的LeetCode提来练习练习，顺便把结果分享下

题目描述：

给定一个整数数组`nums`和一个目标值`target`，请你在该数组中找出和为目标值的那 两个 整数，并返回他们的数组下标。

你可以假设每种输入只会对应一个答案。但是，你不能重复利用这个数组中同样的元素。

示例：

```text
给定 nums = [2, 7, 11, 15], target = 9

因为 nums[0] + nums[1] = 2 + 7 = 9
所以返回 [0, 1]
```

首先第一种办法大家很容易想到，暴力的遍历每一个元素。

```go
func twoSum(nums []int, target int) []int {
    var res []int
    for i1, v1 := range nums {
        for i2, v2 := range nums[i1+1:] {
            if v1+v2 == target {
                res = []int{i1, i2 + i1 + 1}
                return res
            }
        }
    }
    return res
}
```

暴力法可以看到时间复杂度是O(n<sup>2</sup>)，时间复杂度比较高，我们可以用哈希表来优化，通过以空间换取速度的方式，我们可以将查找时间从 O(n)降低到 O(1)。

<a id="more"></a>

```go
func twoSum(nums []int, target int) []int {
    m := make(map[int]int)
    for i, v := range nums {
        m[v] = i
    }
    for i, v := range nums {
        v2 := target - v
        if _, ok := m[v2]; ok && i != m[v2] {
            res := []int{i, m[v2]}
            return res
        }
    }
    return nil
}
```

另外我尝试了先排序后查找的办法，实际测试下来效果也很好。

```go
func index(nums []int, n int) int {
    for idx, v := range nums {
        if n == v {
            return idx
        }
    }
    return -1
}

func reverseIndex(nums []int, n int) int {
    for idx := len(nums) - 1; idx >= 0; idx-- {
        if nums[idx] == n {
            return idx
        }
    }
    return -1
}

func twoSum(nums []int, target int) []int {
    sorted := make([]int, len(nums))
    copy(sorted, nums)

    sort.Ints(sorted)
    i, j, s := 0, len(sorted)-1, 0
    for {
        switch s = sorted[i] + sorted[j]; {
        case s == target:
            return []int{index(nums, sorted[i]), reverseIndex(nums, sorted[j])}
        case s > target:
            j--
        case s < target:
            i++
        }
    }

    return nil
}
```

OK，基本上就是这样，下一篇讲讲golang里的指针吧。
