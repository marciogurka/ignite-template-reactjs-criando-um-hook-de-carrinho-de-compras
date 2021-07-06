import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const updateCartInfo = (updatedCart: Product[]) => {
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    setCart(updatedCart);
  };

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get("/stock");
      const currentStock: Stock[] = response.data;
      const productCartIndex = cart.findIndex(
        (product) => product.id === productId
      );

      if (productCartIndex > -1) {
        // Check if there is some stock of the product
        const productStockData = currentStock.find(
          (item) => item.id === productId
        );

        if (
          productStockData &&
          productStockData.amount === cart[productCartIndex].amount
        ) {
          throw new Error("Quantidade solicitada fora de estoque");
        }
        const updatedCart = cart.map((product, index) => {
          if (index === productCartIndex) {
            return {
              ...product,
              amount: product.amount + 1,
            };
          }
          return product;
        });
        updateCartInfo(updatedCart);
      } else {
        const responseProducts = await api.get("/products");
        const products: Product[] = responseProducts.data;
        const productInfo = products.find(
          (product) => product.id === productId
        );
        if (productInfo) {
          const updatedCart = [...cart, { ...productInfo, amount: 1 }];
          updateCartInfo(updatedCart);
        } else {
          throw new Error("Erro na adição do produto");
        }
      }
    } catch (error) {
      toast.error(error.message ?? "Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
