import { Request, Response } from "express";
import * as userService from "../Users/users.services";

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(Number(req.params.id));
    if (!user) {
     res.status(404).json({ message: "User not found" });
     return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { First_name, Last_name, Email, Password } = req.body;

    // ✅ Check for required fields
    if (!First_name || !Last_name || !Email || !Password) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Proceed to create user
    const newUser = await userService.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: "Error creating user" });
  }
};


export const updateUser = async (req: Request, res: Response) => {
  try {
    req.body.Updated_at = new Date(); // use Date object, not Date.now()

    const updatedUser = await userService.updateUser(Number(req.params.id), req.body);

    if (!updatedUser || updatedUser.length === 0) {
     res.status(200).json([]);
     return; // ✅ return empty array as your test expects
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error });
  }
};


export const deleteUser = async (req: Request, res: Response) => {
  try {
    await userService.deleteUser(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
};
