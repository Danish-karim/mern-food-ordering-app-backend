import { Request, Response } from "express";
import Restaurant from "../models/restaurant";

const getRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.params.restaurantId;
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }
    res.json(restaurant);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong!",
    });
  }
};
const searchRestaurants = async (req: Request, res: Response) => {
  try {
    const city = req.params.city;

    const searchQuery = (req.query.searchQuery as string) || "";

    const selectedCuisines = (req.query.selectedCuisines as string) || "";

    const sortOption = (req.query.sortOption as string) || "lastUpdated";

    const page = parseInt(req.query.page as string) || 1;

    let query: any = {};
    query["city"] = new RegExp(city, "i");

    const cityCheck = await Restaurant.countDocuments(query);
    if (cityCheck === 0) {
      return res.status(404).json({
        data: [],
        pagination: {
          total: 0,
          page: 1,
          pages: 1,
        },
      });
    }

    if (selectedCuisines) {
      const cuisinesArray = selectedCuisines
        .split(",")
        .map((cuisine) => new RegExp(cuisine, "i"));
      query["cuisines"] = { $all: cuisinesArray };
    }

    if (searchQuery) {
      const searchRegexp = new RegExp(searchQuery, "i");
      query["$or"] = [
        { restaurantName: searchRegexp },
        { cuisines: { $in: [searchRegexp] } },
      ];
    }

    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const restaurants = await Restaurant.find(query)
      .sort({ [sortOption]: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    //lean removes unnecaary items and only return plain  javasript object

    const total = await Restaurant.countDocuments(query);

    const response = {
      data: restaurants,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / pageSize),
      },
    };
    res.json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Something went Wrong!",
    });
  }
};

export default { searchRestaurants, getRestaurant };
