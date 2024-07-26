import {asyncHandler} from "../utils/asyncHandler.js"
import { apiError } from "../utils/errorHandler.js"
import { User } from "../models/user.model.js"
import { apiResponse } from "../utils/response.js"
async function deleteAll(){
    await User.deleteMany({})
}
async function generateRefreshAccessToken(userId){
    const user=await User.findById(userId)
    const refreshToken=await user.generateRefreshToken()
const accessToken=await user.generateAccesToken()
user.refreshToken=refreshToken
await user.save({validateBefeoreSave:false})
return [accessToken,refreshToken]

}

export const register=asyncHandler(
    async (req,res)=>{
        const {username,password,email}=req.body
        if([username,password,email].some((item)=>item?.trim()=="")){
            throw new apiError("All fields are required ",409)
        }
        const user= await User.findOne({
            $or:[{username},{email}]
        })
        if(user){
           throw new apiError("already exist",400)

        }
        const createdUser=await User.create({
          username,
          password,
          email,
        })
        generateRefreshAccessToken(createdUser._id)// very important to note 
        // deleteAll()
        res.json(new apiResponse("message",createdUser._id,200))
    }
)
export const login =asyncHandler(async (req,res)=>{
   const {username,password}=req.body
   
   if([username,password].some((item)=>item?.trim()=="")){
    return apiError("please enter your username and password both",404)
   }
   const user=await User.findOne({username})
   
   if(!user){
    return apiError("No user found with this username",300)
   }
   const userPasswordverifier=user.isPasswordCorrect(password)
   if(!userPasswordverifier){
    return apiError("the Entered password is incorrect")
   }
  const [refreshToken,accessToken]=await generateRefreshAccessToken(user._id)
   let option={
    httpOnly:true,
    secure:true
   }
   user.password=" ";
   user.refreshToken=refreshToken


   res.status(200).cookie("refreshToken",refreshToken,option).cookie("accessToken",accessToken,option).json(new apiResponse("User Log In Successfully",
    {
       user,
       accessToken,
       refreshToken
    }
    ,
    200
 ))
} )