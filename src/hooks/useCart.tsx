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
      const cartProduct = cart.find((product) => product.id === productId);
      const response = await api.get(`/stock/${productId}`);
      const productStockAmount: number = response.data.amount;
      if (productStockAmount < (cartProduct ? cartProduct.amount + 1 : 1)) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      if (cartProduct) {
        const updatedCart = cart.map((product) => {
          if (product.id === productId) {
            return {
              ...product,
              amount: product.amount + 1,
            };
          }
          return product;
        });
        updateCartInfo(updatedCart);
      } else {
        const product = await api.get(`/products/${productId}`);
        const productInfo: Product = { ...product.data, amount: 1 };

        const updatedCart = [...cart, productInfo];
        updateCartInfo(updatedCart);
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productToRemove = cart.find((product) => product.id === productId);
      if (!productToRemove) {
        toast.error("Erro na remoção do produto");
        return;
      }
      const updatedCart = cart.filter((product) => product.id !== productId);
      updateCartInfo(updatedCart);
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;
      const cartProduct = cart.find((product) => product.id === productId);
      if (!cartProduct) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      } else {
        const response = await api.get(`/stock/${productId}`);
        const productStockAmount: number = response.data.amount;
        if (productStockAmount < amount) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }
      }

      const updatedCart = cart.map((product) => {
        if (product.id === productId) {
          return {
            ...product,
            amount,
          };
        }
        return product;
      });
      updateCartInfo(updatedCart);
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
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
