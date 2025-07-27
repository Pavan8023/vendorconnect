// src/lib/vendorGPT.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { Product, ChatMessage, BidRequest } from '../types';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);

class VendorGPT {
  private model: any;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  async processMessage(
    userMessage: string, 
    userLocation?: string,
    userId?: string,
    userName?: string,
    userEmail?: string
  ): Promise<ChatMessage> {
    try {
      // Extract product requirements using AI
      const extractionPrompt = `
        Extract product requirements from this message: "${userMessage}"
        
        Respond in JSON format:
        {
          "product_type": "extracted product name",
          "quantity": "extracted quantity with unit",
          "budget": "extracted budget if mentioned",
          "urgency": "immediate/today/tomorrow/this_week",
          "intent": "buy/inquiry/price_check/availability/bid"
        }
        
        If information is missing, set to null.
        If user mentions wanting to bid or make a request when product not found, set intent to "bid".
      `;

      const extractionResult = await this.model.generateContent(extractionPrompt);
      const extractedData = this.parseAIResponse(extractionResult.response.text());

      let botResponse = "";
      let relevantProducts: Product[] = [];

      if (extractedData?.intent === 'buy' && extractedData?.product_type) {
        // Fetch relevant products from Firestore
        relevantProducts = await this.fetchRelevantProducts(
          extractedData.product_type,
          extractedData.budget,
          userLocation
        );

        if (relevantProducts.length > 0) {
          botResponse = this.generateProductResponse(extractedData, relevantProducts);
        } else {
          // No products found - offer bidding option
          botResponse = `Sorry, I couldn't find any ${extractedData.product_type} suppliers in your area right now. 

Would you like to:
1. **Create a Bid Request** - Tell wholesalers what you need and your budget
2. Search in nearby areas (within 10km)?
3. Get notified when suppliers become available?

To create a bid request, just say something like:
"I want to bid ₹${extractedData.budget || '50'} for ${extractedData.quantity || '10kg'} ${extractedData.product_type}"`;
        }
      } else if (extractedData?.intent === 'bid' || userMessage.toLowerCase().includes('bid')) {
        // Handle bid creation
        if (userId && userName && userEmail && extractedData?.product_type) {
          const bidId = await this.createBidRequest({
            vendorId: userId,
            vendorName: userName,
            vendorEmail: userEmail,
            productName: extractedData.product_type,
            description: `Looking for ${extractedData.product_type}`,
            quantity: this.parseQuantity(extractedData.quantity) || 10,
            bidPrice: this.parseBudget(extractedData.budget) || 0,
            urgency: extractedData.urgency || 'this_week',
            location: userLocation || 'Not specified'
          });

          botResponse = `✅ **Bid Request Created Successfully!**

**Request Details:**
- Product: ${extractedData.product_type}
- Quantity: ${this.parseQuantity(extractedData.quantity) || 10} units
- Your Bid: ₹${this.parseBudget(extractedData.budget) || 'Not specified'}
- Urgency: ${extractedData.urgency || 'This week'}

Your request has been sent to all nearby wholesalers. You'll be notified when someone accepts your bid!

**Request ID:** ${bidId}`;
        } else {
          botResponse = `To create a bid request, I need more details:

Please provide:
- What product do you need?
- How much quantity?
- Your budget per unit
- When do you need it?

Example: "I need 20kg onions, budget ₹30 per kg, needed tomorrow"`;
        }
      } else {
        // General conversation or clarification
        const conversationPrompt = `
          You are VendorGPT, an AI assistant helping street food vendors find suppliers.
          User said: "${userMessage}"
          
          Context: You help vendors find fresh vegetables, fruits, and ingredients from local suppliers.
          You also help them create bid requests when products aren't available.
          
          Respond in a helpful, friendly manner. If they need suppliers, ask for:
          - What product they need
          - How much quantity
          - Their budget (if flexible)
          - When they need it
          
          Keep responses concise and practical.
        `;

        const result = await this.model.generateContent(conversationPrompt);
        botResponse = result.response.text();
      }

      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        message: botResponse,
        isBot: true,
        timestamp: new Date(),
        products: relevantProducts.length > 0 ? relevantProducts : undefined
      };

      return botMessage;

    } catch (error) {
      console.error('VendorGPT Error:', error);
      return {
        id: `bot_${Date.now()}`,
        message: "Sorry, I'm having trouble processing your request right now. Please try again.",
        isBot: true,
        timestamp: new Date()
      };
    }
  }

  private async createBidRequest(bidData: Omit<BidRequest, 'id' | 'status' | 'createdAt'>): Promise<string> {
    try {
      const bidRequest: Omit<BidRequest, 'id'> = {
        ...bidData,
        status: 'pending',
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'bidRequests'), bidRequest);
      return docRef.id;
    } catch (error) {
      console.error('Error creating bid request:', error);
      throw error;
    }
  }

  private parseQuantity(quantityStr: string): number {
    if (!quantityStr) return 10;
    const numbers = quantityStr.match(/\d+/g);
    return numbers ? parseInt(numbers[0]) : 10;
  }

  private parseBudget(budgetStr: string): number {
    if (!budgetStr) return 0;
    const numbers = budgetStr.match(/\d+/g);
    return numbers ? parseInt(numbers[0]) : 0;
  }

  private parseAIResponse(response: string): any {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { intent: 'general' };
    } catch {
      return { intent: 'general' };
    }
  }

  private async fetchRelevantProducts(
    productType: string, 
    budget?: string, 
    userLocation?: string
  ): Promise<Product[]> {
    try {
      const productsRef = collection(db, 'products');
      const querySnapshot = await getDocs(productsRef);
      
      let products: Product[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        products.push({
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          address: data.address || '',
          city: data.city || '',
          mobileNo: data.mobileNo || '',
          countryCode: data.countryCode || '+91',
          price: data.price || 0,
          minOrder: data.minOrder || 1,
          quantity: data.quantity || 0,
          imageUrl: data.imageUrl || '',
          wholesalerId: data.wholesalerId || '',
          wholesalerName: data.wholesalerName || '',
          wholesalerPhoto: data.wholesalerPhoto || ''
        });
      });

      // Filter products based on AI extracted requirements
      const filtered = products.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(productType.toLowerCase()) ||
                          product.description.toLowerCase().includes(productType.toLowerCase());
        const budgetMatch = budget ? this.checkBudgetMatch(product.price, budget) : true;
        const stockAvailable = product.quantity > 0;
        
        return nameMatch && budgetMatch && stockAvailable;
      });

      return filtered.slice(0, 5); // Limit to top 5 results

    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  private checkBudgetMatch(price: number, budgetString: string): boolean {
    const budgetNumbers = budgetString.match(/\d+/g);
    if (!budgetNumbers) return true;
    
    const budget = parseInt(budgetNumbers[0]);
    return price <= budget * 1.2; // Allow 20% flexibility
  }

  private generateProductResponse(extractedData: any, products: Product[]): string {
    const productCount = products.length;
    const productType = extractedData.product_type;
    
    return `Great! I found ${productCount} supplier${productCount > 1 ? 's' : ''} for ${productType}:

${products.map((product, index) => 
  `${index + 1}. **${product.name}** - ₹${product.price}/unit
   📍 ${product.address}, ${product.city}
   👤 ${product.wholesalerName || 'Supplier'}
   📦 Available: ${product.quantity} units (Min order: ${product.minOrder})
   📞 ${product.countryCode} ${product.mobileNo}`
).join('\n\n')}

Would you like to:
• View detailed photos of any product
• Contact a supplier directly
• Check delivery options`;
  }
}

export default VendorGPT;
